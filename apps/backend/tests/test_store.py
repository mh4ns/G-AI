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
