from apps.eligibility.services.rule_engine import check, evaluate, RuleResult

def test_pm_kisan_eligible():
    rules = {
        "code": "pm_kisan",
        "near_miss_threshold": 1,
        "conditions": [
            {"field": "occupation", "op": "eq", "value": "farmer"},
            {"field": "land_owned", "op": "eq", "value": True},
            {"field": "income", "op": "lte", "value": 200000}
        ]
    }
    profile = {
        "occupation": "farmer",
        "land_owned": True,
        "income": 150000
    }
    res = evaluate(rules, profile)
    assert res.status == "eligible"
    assert len(res.matched) == 3
    assert len(res.missing) == 0

def test_pm_kisan_near_miss():
    rules = {
        "code": "pm_kisan",
        "near_miss_threshold": 1,
        "conditions": [
            {"field": "occupation", "op": "eq", "value": "farmer"},
            {"field": "land_owned", "op": "eq", "value": True},
            {"field": "income", "op": "lte", "value": 200000}
        ]
    }
    # Income slightly above threshold, 1 rule missing -> near_miss
    profile = {
        "occupation": "farmer",
        "land_owned": True,
        "income": 250000
    }
    res = evaluate(rules, profile)
    assert res.status == "near_miss"
    assert len(res.missing) == 1

def test_pm_kisan_not_eligible():
    rules = {
        "code": "pm_kisan",
        "near_miss_threshold": 1,
        "conditions": [
            {"field": "occupation", "op": "eq", "value": "farmer"},
            {"field": "land_owned", "op": "eq", "value": True},
            {"field": "income", "op": "lte", "value": 200000}
        ]
    }
    # 2 rules missing -> not_eligible
    profile = {
        "occupation": "student",
        "land_owned": False,
        "income": 100000
    }
    res = evaluate(rules, profile)
    assert res.status == "not_eligible"
    assert len(res.missing) == 2

def test_in_operator_and_case_insensitivity():
    rule = {"field": "occupation", "op": "in", "value": ["Artisan", "Worker"]}
    assert check(rule, {"occupation": "artisan"}) is True
    assert check(rule, {"occupation": "WORKER"}) is True
    assert check(rule, {"occupation": "farmer"}) is False
