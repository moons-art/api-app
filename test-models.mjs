import fs from "fs";

const envText = fs.readFileSync(".env.local", "utf-8");
const match = envText.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1] : null;

async function testV25() {
    if (!apiKey) {
        console.log("No API Key");
        return;
    }
    
    // listModels에서 확인된 정확한 이름을 사용합니다.
    const mName = "gemini-2.5-flash"; 
    console.log(`--- Testing ${mName} (2026 Standard?) ---`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${mName}:generateContent?key=${apiKey}`;
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "hi" }] }]
            })
        });
        
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log(`PASS: ${JSON.stringify(data).substring(0, 100)}`);
        } else {
            console.log(`FAIL: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`FETCH ERROR: ${e.message}`);
    }
}

testV25();
