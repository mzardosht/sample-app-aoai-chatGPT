import { ESAIFeedback } from "./esai.models";

export async function feedbackApi(feedback: ESAIFeedback): Promise<void> {
    const response = await fetch("/feedback", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(feedback),
    });

    if (response.status > 299 || !response.ok) {
        alert("Unknown error");
        throw Error("Unknown error");
    }
}

export async function azureIndexDateApi() : Promise<string> {
    const response = await fetch("/azureindexdate", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });

    if (response.status > 299 || !response.ok) {
        alert("Unknown error");
        throw Error("Unknown error");
    }

    return await response.text();
}