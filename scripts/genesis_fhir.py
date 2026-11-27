"""Synthetic educational FHIR R4 examples, never real patient data."""
def example_bundle():
    return {"resourceType":"Bundle","type":"collection","entry":[
        {"resource":{"resourceType":"Patient","id":"synthetic-demo","active":True}},
        {"resource":{"resourceType":"Observation","id":"synthetic-pulse",
            "status":"final","code":{"coding":[{"system":"http://loinc.org","code":"8867-4","display":"Heart rate"}]},
            "subject":{"reference":"Patient/synthetic-demo"},
            "valueQuantity":{"value":72,"unit":"beats/minute","system":"http://unitsofmeasure.org","code":"/min"}}}]}

if __name__ == "__main__":
    import json
    print(json.dumps(example_bundle(),indent=2))
