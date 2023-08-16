export type Settings = {
    in_domain_only: boolean | null;
}

export type AzureIndexDate = {
    azure_index_date: string | null;
}

export type ESAIDocFeedback = {
    title: string;
    filepath: string;
}

export type ESAIFeedback = {
    verbatim: string | null;
    inaccurate_answer: boolean | null;
    insufficient: boolean | null;
    outdated: boolean | null;
    question: string | null;
    answer: string | null;
    top_docs: ESAIDocFeedback[];
    allow_contact: boolean | null;
    email: string | null;
    system_message: string | null;
}