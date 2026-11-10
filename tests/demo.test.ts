import { describe, expect, it } from "vitest";
import { validateDemoInput } from "@/lib/demo";

const s3Url = "https://bucket.s3.eu-west-1.amazonaws.com/exercises/x.mp4";
const s3Key = "exercises/x.mp4";

describe("demo validation", () => {
  it("accepts an exercise without demo media", () => {
    expect(validateDemoInput({})).toBeNull();
    expect(validateDemoInput({ demoType: null, demoUrl: null, demoKey: null })).toBeNull();
  });

  it("requires an URL for embeds", () => {
    expect(validateDemoInput({ demoType: "embed" })).toMatch(/URL/);
    expect(validateDemoInput({ demoType: "embed", demoUrl: "" })).toMatch(/URL/);
  });

  it("rejects non-http embed URLs", () => {
    expect(validateDemoInput({ demoType: "embed", demoUrl: "notaurl" })).toMatch(/https/);
    expect(validateDemoInput({ demoType: "embed", demoUrl: "javascript:alert(1)" })).toMatch(/https/);
  });

  it("accepts http(s) embeds", () => {
    expect(validateDemoInput({ demoType: "embed", demoUrl: "https://youtube.com/watch?v=1" })).toBeNull();
    expect(validateDemoInput({ demoType: "embed", demoUrl: "http://vimeo.com/2" })).toBeNull();
  });

  it("requires a finished upload for upload demos", () => {
    expect(validateDemoInput({ demoType: "upload" })).toMatch(/Sube/);
    expect(validateDemoInput({ demoType: "upload", demoUrl: s3Url })).toMatch(/Sube/);
  });

  it("accepts a completed upload", () => {
    expect(validateDemoInput({ demoType: "upload", demoUrl: s3Url, demoKey: s3Key })).toBeNull();
  });

  it("flags media given without a demo type", () => {
    expect(validateDemoInput({ demoUrl: s3Url })).toMatch(/tipo/i);
    expect(validateDemoInput({ demoKey: s3Key })).toMatch(/tipo/i);
  });
});
