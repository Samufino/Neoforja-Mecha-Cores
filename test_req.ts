async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "test" })
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Text:", text.substring(0, 100));
  } catch (e) {
    console.log("Error:", e);
  }
}
run();
