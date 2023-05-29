import request from 'supertest';
import { expect } from "chai";
import { createExpressServer } from "@server/config/express";
const app = createExpressServer();

describe("server checks", function () {
  it("server instantiated without error", async () => {
    const response = await request(app).get("/v1/health_checker")
    expect(response.status).to.equal(200);
  });
});

describe("mailchimp checks", function () {
  it("server instantiated without error", async () => {
    const response = await request(app).get("/v1/health_mailchimp")
    expect(response.status).to.equal(200);
    expect(response.body).to.deep.equal({ "health_status": "Everything's Chimpy!" });
  });
});