import os
import uuid
from flask import Blueprint, request, jsonify
from azure.cosmosdb.table.tableservice import TableService
from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

# Create a blueprint instance
esai_blueprint = Blueprint('esai', __name__)

TABLE_SERVICE_CONNECTION_STRING = os.environ.get("TABLE_SERVICE_CONNECTION_STRING")

if (TABLE_SERVICE_CONNECTION_STRING):
    table_service = TableService(connection_string=TABLE_SERVICE_CONNECTION_STRING)

@esai_blueprint.route("/azureindexdate", methods=["GET"])
def azureindexdate():
    AZURE_INDEX_DATE = os.environ.get("AZURE_INDEX_DATE","2023-07-24")
    return AZURE_INDEX_DATE


@esai_blueprint.route("/feedback", methods=["POST"])
def feedback():
    json = request.get_json()
    id = uuid.uuid4()
    username = ""
    # Check the allowContact setting, and if true, then track the username
    #allowedToContact = json["allow_contact"]
    #if (allowedToContact):
        #username = request.headers.get("X-MS-CLIENT-PRINCIPAL-NAME")
    #else:
        #username = ""
    topDocs = jsonify(json["top_docs"]).data.decode("utf-8")


    anonymized_verbatim = anonymize(json["verbatim"], is_feedback=True)
    anonymized_question = anonymize(json["question"])
    anonymized_answer = anonymize(json["answer"])

    tableEntity = {
        "PartitionKey": "Global",
        "RowKey": str(id),
        "username": username,
        "overall_response_quality": json["overall_response_quality"],
        "overall_document_quality": json["overall_document_quality"],
        "verbatim": anonymized_verbatim,
        "inaccurate_answer": json["inaccurate_answer"],
        "missing_info": json["missing_info"],
        "too_long": json["too_long"],
        "too_short": json["too_short"],
        "confusing": json["confusing"],
        "offensive": json["offensive"],
        "biased": json["biased"],
        "outdated": json["outdated"],
        "repetitive": json["repetitive"],
        "fantastic": json["fantastic"],
        "case_number": json["case_number"],
        "question_id": json["question_id"],
        "question": anonymized_question,
        "answer_id": json["answer_id"],
        "answer": anonymized_answer,
        "contentIndex": json["contentIndex"],
        "top_docs": topDocs,
        "in_domain": json["in_domain"],
    }

    if (table_service):
        table_service.insert_entity("ESAIGPTFeedback", tableEntity)

    return jsonify({"success": True, "feedback": json})

# PII Scrubbing
configuration = {
    "nlp_engine_name": "spacy",
    "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
}
provider = NlpEngineProvider(nlp_configuration=configuration)
nlp_engine = provider.create_engine()

analyzer = AnalyzerEngine(nlp_engine=nlp_engine)
anonymizer = AnonymizerEngine()

# Simple function to keep certain PII
def keep(text: str):
    return text

fb_operators = { "URL": OperatorConfig("custom", { "lambda": keep }), "DEFAULT": OperatorConfig("replace") }
qa_operators = { "DEFAULT": OperatorConfig("replace") }

def anonymize(text: str, is_feedback=False):
    # Call analyzer to get results
    results = analyzer.analyze(
        text=text,
        language="en",
    )

    anonymized_text = anonymizer.anonymize(
        text=text,
        analyzer_results=results,
        operators=fb_operators if is_feedback else qa_operators,
    )

    return anonymized_text.text
