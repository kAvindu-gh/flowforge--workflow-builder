from collections import defaultdict, deque


def topological_sort(nodes: list, edges: list) -> list:
    """
    Takes a list of nodes and edges, returns nodes in execution order.
    Uses Kahn's algorithm (BFS-based topological sort).
    Raises an error if a cycle is detected (A → B → A is invalid).
    """
    node_map = {node["id"]: node for node in nodes}
    in_degree = {node["id"]: 0 for node in nodes}
    adjacency = defaultdict(list)

    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        adjacency[source].append(target)
        in_degree[target] += 1

    queue = deque()
    for node_id, degree in in_degree.items():
        if degree == 0:
            queue.append(node_id)

    execution_order = []

    while queue:
        current = queue.popleft()
        execution_order.append(node_map[current])

        for neighbour in adjacency[current]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    if len(execution_order) != len(nodes):
        raise ValueError("Cycle detected in workflow — cannot execute")

    return execution_order


def get_upstream_output(node_id: str, edges: list, outputs_by_node: dict):
    """
    Finds the node that feeds INTO this node (its single parent),
    and returns that parent's output. Returns None if no parent ran yet.
    """
    for edge in edges:
        if edge["target"] == node_id:
            parent_id = edge["source"]
            return outputs_by_node.get(parent_id)
    return None


def extract_number(value):
    """
    Tries to pull a usable number out of any upstream output shape,
    so Filter nodes can auto-read it without the user manually typing it.
    """
    if isinstance(value, (int, float)):
        return value
    if isinstance(value, dict):
        # Common weather API shape: {"current": {"temperature_2m": 28.4}}
        if "current" in value and isinstance(value["current"], dict):
            for v in value["current"].values():
                if isinstance(v, (int, float)):
                    return v
        # Fallback — first numeric value found anywhere in the dict
        for v in value.values():
            if isinstance(v, (int, float)):
                return v
            if isinstance(v, dict):
                found = extract_number(v)
                if found is not None:
                    return found
    return None


def extract_text(value):
    """Pulls usable text out of upstream output for Transform nodes."""
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        if "body" in value:
            return str(value["body"])
        return str(value)
    return str(value) if value is not None else ""


def execute_node(node: dict, upstream_output=None) -> dict:
    node_type = node.get("type", "unknown")
    node_data = node.get("data", {})

    if node_type == "http":
        return execute_http_node(node_data)
    elif node_type == "delay":
        return execute_delay_node(node_data)
    elif node_type == "filter":
        return execute_filter_node(node_data, upstream_output)
    elif node_type == "transform":
        return execute_transform_node(node_data, upstream_output)
    else:
        return {"status": "skipped", "output": f"Unknown node type: {node_type}"}


def execute_http_node(data: dict) -> dict:
    import requests
    url = data.get("url", "")
    method = data.get("method", "GET").upper()

    if not url:
        return {"status": "failed", "output": "No URL provided"}

    try:
        response = requests.request(method, url, timeout=10)
        try:
            body = response.json()
        except ValueError:
            body = response.text[:500]
        return {
            "status": "success",
            "output": {
                "status_code": response.status_code,
                "body": body
            }
        }
    except Exception as e:
        return {"status": "failed", "output": str(e)}


def execute_delay_node(data: dict) -> dict:
    import time
    seconds = data.get("seconds", 1)
    time.sleep(seconds)
    return {"status": "success", "output": f"Waited {seconds} second(s)"}


def execute_filter_node(data: dict, upstream_output=None) -> dict:
    use_upstream = data.get("useUpstream", False)
    operator      = data.get("operator", ">")
    threshold     = data.get("threshold", 0)

    if use_upstream and upstream_output is not None:
        value = extract_number(upstream_output.get("output")) if isinstance(upstream_output, dict) else extract_number(upstream_output)
        if value is None:
            return {"status": "failed", "output": "Could not find a number in the previous node's output"}
    else:
        value = data.get("value", 0)

    conditions = {
        ">":  value > threshold,
        "<":  value < threshold,
        "==": value == threshold,
        ">=": value >= threshold,
        "<=": value <= threshold,
    }

    passed = conditions.get(operator, False)
    return {
        "status": "success",
        "output": {
            "value": value,
            "passed": passed,
            "message": f"{value} {operator} {threshold} is {passed}"
        }
    }


def execute_transform_node(data: dict, upstream_output=None) -> dict:
    use_upstream = data.get("useUpstream", False)
    operation     = data.get("operation", "uppercase")

    if use_upstream and upstream_output is not None:
        text = extract_text(upstream_output.get("output")) if isinstance(upstream_output, dict) else extract_text(upstream_output)
    else:
        text = data.get("text", "")

    operations = {
        "uppercase": text.upper(),
        "lowercase": text.lower(),
        "titlecase": text.title(),
    }

    result = operations.get(operation, text)
    return {"status": "success", "output": result}


def run_workflow(nodes: list, edges: list) -> dict:
    if not nodes:
        return {"status": "failed", "error": "No nodes in workflow"}

    try:
        ordered_nodes = topological_sort(nodes, edges)
    except ValueError as e:
        return {"status": "failed", "error": str(e)}

    results = []
    outputs_by_node = {}
    overall_status = "success"

    for node in ordered_nodes:
        upstream_output = get_upstream_output(node["id"], edges, outputs_by_node)
        node_result = execute_node(node, upstream_output)

        outputs_by_node[node["id"]] = node_result

        results.append({
            "node_id":    node["id"],
            "node_type":  node.get("type", "unknown"),
            "node_label": node.get("data", {}).get("label", node["id"]),
            "result":     node_result
        })

        if node_result["status"] == "failed":
            overall_status = "failed"
            break

    return {
        "status": overall_status,
        "steps":  results
    }