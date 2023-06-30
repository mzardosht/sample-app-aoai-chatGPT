export type Settings = {
    acs_index: string | null;
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
    overall_response_quality: number | null;
    overall_document_quality: number | null;
    verbatim: string | null;
    inaccurate_answer: boolean | null;
    missing_info: boolean | null;
    too_long: boolean | null;
    too_short: boolean | null;
    confusing: boolean | null;
    offensive: boolean | null;
    biased: boolean | null;
    outdated: boolean | null;
    repetitive: boolean | null;
    fantastic: boolean | null;
    case_number: string | null;
    question_id: string | null;
    question: string | null;
    answer_id: string | null;
    answer: string | null;
    contentIndex: string | null;
    top_docs: ESAIDocFeedback[];
    in_domain: boolean | null;
    // allow_contact: boolean | null;
}