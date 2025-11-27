import polvo from "@usepolvo/core";

async function simpleExample() {
  console.log("Simple Polvo Example\n");

  try {
    // Simple GET request
    console.log("1. Simple GET request");
    const response = await polvo.get("https://httpbin.org/json");
    console.log("Response:", response.data);
    console.log("");

    // POST with JSON data
    console.log("2. POST with JSON data");
    const postResponse = await polvo.post("https://httpbin.org/post", {
      message: "Hello from Polvo!",
      timestamp: new Date().toISOString(),
    });
    console.log("Posted data:", postResponse.data.json);
    console.log("");

    // GET with headers
    console.log("3. GET with custom headers");
    const headerResponse = await polvo.get("https://httpbin.org/headers", {
      headers: {
        "X-Custom-Header": "Polvo-Example",
        "User-Agent": "Polvo/1.0.0 Example",
      },
    });
    console.log("Request headers:", headerResponse.data.headers);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the example
simpleExample();
