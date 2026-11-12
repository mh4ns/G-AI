async def _order(client, items):
    return await client.post(
        "/api/v1/store/orders",
        json={
            "customer_email": "buyer@example.com",
            "customer_name": "Buyer",
            "shipping_address": "1 Test Street, Hanoi",
            "items": items,
        },
    )


async def test_order_uses_catalog_price_not_client_price(client, products):
    res = await _order(
        client, [{"product_id": "ga-test-01", "size": "M", "quantity": 2, "price": 0.01, "name": "Free stuff"}]
    )
    assert res.status_code == 201, res.text
    body = res.json()
    assert body["total_amount"] == 145.0
    assert body["items"][0]["name"] == "Test Legging"
    assert body["payment_status"] == "pending"


async def test_order_reserves_stock_and_rejects_oversell(client, products):
    assert (await _order(client, [{"product_id": "ga-test-01", "size": "S", "quantity": 2}])).status_code == 201
    # Only 1 left; two lines for the same product are summed before checking.
    res = await _order(
        client,
        [{"product_id": "ga-test-01", "size": "S", "quantity": 1}, {"product_id": "ga-test-01", "size": "M", "quantity": 1}],
    )
    assert res.status_code == 409
    product = (await client.get("/api/v1/store/products/ga-test-01")).json()
    assert product["stock_quantity"] == 1


async def test_order_rejects_unknown_inactive_or_bad_size(client, products):
    assert (await _order(client, [{"product_id": "nope", "size": "M", "quantity": 1}])).status_code == 422
    assert (await _order(client, [{"product_id": "ga-test-02", "size": "M", "quantity": 1}])).status_code == 422
    assert (await _order(client, [{"product_id": "ga-test-01", "size": "XXL", "quantity": 1}])).status_code == 422
    assert (await _order(client, [{"product_id": "ga-test-01", "size": "M", "quantity": 0}])).status_code == 422


async def test_inactive_products_hidden(client, products):
    ids = [p["id"] for p in (await client.get("/api/v1/store/products")).json()]
    assert ids == ["ga-test-01"]
    assert (await client.get("/api/v1/store/products/ga-test-02")).status_code == 404


async def test_products_expose_ui_fields_and_filters(client):
    from app.core.database import async_session_maker
    from app.services.catalog import load_catalog, sync_catalog

    async with async_session_maker() as session:
        await sync_catalog(session, load_catalog())
        await session.commit()

    p5 = (await client.get("/api/v1/store/products/p5")).json()
    assert p5["category"] == "equipment"
    assert p5["subcategory"] == "Tập tại nhà"
    assert p5["activity"] == "pilates"
    assert p5["discount_percent"] == 37
    assert p5["image_hover"].startswith("https://")
    assert p5["description"]

    apparel = (await client.get("/api/v1/store/products", params={"category": "APPAREL"})).json()
    assert [p["id"] for p in apparel] == ["p1", "p2", "p4", "p7"]
    lounge = (await client.get("/api/v1/store/products", params={"category": "apparel", "activity": "lounge"})).json()
    assert [p["id"] for p in lounge] == ["p1", "p7"]


async def test_my_orders_requires_login_and_returns_only_own(client, products):
    from tests.conftest import bearer, register

    assert (await client.get("/api/v1/store/orders/me")).status_code == 401

    alice = await register(client, "alice@example.com")
    first = (await _order(client, [{"product_id": "ga-test-01", "size": "S", "quantity": 1}])).json()
    second = (await _order(client, [{"product_id": "ga-test-01", "size": "M", "quantity": 1}])).json()

    client.cookies.clear()
    await _order(client, [{"product_id": "ga-test-01", "size": "M", "quantity": 1}])  # guest order, same email
    bob = await register(client, "bob@example.com")
    client.cookies.clear()

    mine = (await client.get("/api/v1/store/orders/me", headers=bearer(alice))).json()
    assert {o["id"] for o in mine} == {first["id"], second["id"]}
    assert mine[0]["items"][0]["color_name"] is not None
    assert (await client.get("/api/v1/store/orders/me", headers=bearer(bob))).json() == []
