import { UserInfo, ConversationRequest } from "./models";

export async function conversationApi(options: ConversationRequest, abortSignal: AbortSignal): Promise<Response> {
    const response = await fetch("/conversation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messages: options.messages,
            settings: options.settings
        }),
        signal: abortSignal
    });

    return response;
}

export async function getUserInfo(): Promise<UserInfo[]> {
    const response = await fetch('/.auth/me');
    if (!response.ok) {
        console.log("No identity provider found. Access to chat will be blocked.")
        return [];
    }

    const payload = await response.json();
    return payload;
}

export async function systemMessageApi() : Promise<string> {
    const response = await fetch("/getSystemMessage", {
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