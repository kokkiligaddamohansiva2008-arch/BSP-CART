import test from "node:test";
import assert from "node:assert/strict";
import { recommendCatalogueProducts, assistantAnswer } from "../src/utils/catalogAssistant.js";

const catalogue = [
  { id: 1, name: "Bluetooth Headphones", category: "electronics-and-accessories", price: 1499, rating: 4.6, stock: 10 },
  { id: 2, name: "Basmati Rice", category: "groceries-and-staples", price: 120, rating: 4.9, stock: 3 },
  { id: 3, name: "Rice Flour", category: "groceries-and-staples", price: 80, rating: 4.1, stock: 0 },
  { id: 4, name: "Wireless Mouse", category: "electronics-and-accessories", price: 600, rating: 4.3, stock: 5 },
];
test("assistant searches by actual product name", () => {
  assert.deepEqual(recommendCatalogueProducts("show headphones", catalogue).map(p => p.id), [1]);
});
test("assistant applies budget and grocery category", () => {
  const result = recommendCatalogueProducts("grocery under 200", catalogue);
  assert.deepEqual(result.map(p => p.id).sort(), [2, 3]);
});
test("assistant understands only in-stock products", () => {
  const result = recommendCatalogueProducts("best rated in-stock products", catalogue);
  assert.equal(result[0].id, 2);
  assert.ok(result.every(p => p.stock > 0));
});
test("assistant does not hallucinate nonexistent products", () => {
  assert.deepEqual(recommendCatalogueProducts("spaceship engine", catalogue), []);
});
test("order help links to the existing order page", () => {
  const result = assistantAnswer("track my order", catalogue);
  assert.equal(result.href, "/orders");
  assert.equal(result.matches.length, 0);
});
