const request = require("supertest");
const app = require("../src/app");

describe("Express app diagnostic", () => {
    test("responds to an unknown route", async () => {
        const response = await request(app)
            .get("/this-route-does-not-exist");

        expect(response.status).toBe(404);
    });
});