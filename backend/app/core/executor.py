from collections import defaultdict, deque


def topological_sort(nodes: list, edges: list) -> list:
    """
    Takes a list of nodes and edges, returns nodes in execution order.
    Uses Kahn's algorithm (BFS-based topological sort).
    Raises an error if a cycle is detected (A → B → A is invalid).
    """

    # Build a map of node_id → node data
    node_map = {node["id"]: node for node in nodes}

    # Count how many edges point INTO each node (in-degree)
    in_degree = {node["id"]: 0 for node in nodes}

    # Build adjacency list: who does each node point to?
    adjacency = defaultdict(list)

    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        adjacency[source].append(target)
        in_degree[target] += 1

    # Start with all nodes that have no incoming edges (nothing before them)
    queue = deque()
    for node_id, degree in in_degree.items():
        if degree == 0:
            queue.append(node_id)

    execution_order = []

    while queue:
        current = queue.popleft()
        execution_order.append(node_map[current])

        # Reduce in-degree for all neighbours
        for neighbour in adjacency[current]:
            in_degree[neighbour] -= 1
            if in_degree[neighbour] == 0:
                queue.append(neighbour)

    # If we didn't visit all nodes, there's a cycle
    if len(execution_order) != len(nodes):
        raise ValueError("Cycle detected in workflow — cannot execute")

    return execution_order


def execute_node(node: dict) -> dict:
    """
    Executes a single node based on its type.
    Returns a result dict with status and output.
    """
    node_type = node.get("type", "unknown")
    node_data = node.get("data", {})

    if node_type == "http":
        return execute_http_node(node_data)
    elif node_type == "delay":
        return execute_delay_node(node_data)
    elif node_type == "filter":
        return execute_filter_node(node_data)
    elif node_type == "transform":
        return execute_transform_node(node_data)
    else:
        return {"status": "skipped", "output": f"Unknown node type: {node_type}"}


def execute_http_node(data: dict) -> dict:
    """Calls an external HTTP URL"""
    import requests
    url = data.get("url", "")
    method = data.get("method", "GET").upper()

    if not url:
        return {"status": "failed", "output": "No URL provided"}

    try:
        response = requests.request(method, url, timeout=10)
        return {
            "status": "success",
            "output": {
                "status_code": response.status_code,
                "body": response.text[:500]  # limit output size
            }
        }
    except Exception as e:
        return {"status": "failed", "output": str(e)}


def execute_delay_node(data: dict) -> dict:
    """Waits for a given number of seconds"""
    import time
    seconds = data.get("seconds", 1)
    time.sleep(seconds)
    return {"status": "success", "output": f"Waited {seconds} second(s)"}


def execute_filter_node(data: dict) -> dict:
    """Checks a condition — passes or blocks"""
    value = data.get("value", 0)
    operator = data.get("operator", ">")
    threshold = data.get("threshold", 0)

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
            "passed": passed,
            "message": f"{value} {operator} {threshold} is {passed}"
        }
    }


def execute_transform_node(data: dict) -> dict:
    """Transforms input text to upper/lower/title case"""
    text = data.get("text", "")
    operation = data.get("operation", "uppercase")

    operations = {
        "uppercase": text.upper(),
        "lowercase": text.lower(),
        "titlecase": text.title(),
    }

    result = operations.get(operation, text)
    return {"status": "success", "output": result}


def run_workflow(nodes: list, edges: list) -> dict:
    """
    Main function — sorts nodes then executes them in order.
    Returns full execution results.
    """
    if not nodes:
        return {"status": "failed", "error": "No nodes in workflow"}

    try:
        ordered_nodes = topological_sort(nodes, edges)
    except ValueError as e:
        return {"status": "failed", "error": str(e)}

    results = []
    overall_status = "success"

    for node in ordered_nodes:
        node_result = execute_node(node)
        results.append({
            "node_id":   node["id"],
            "node_type": node.get("type", "unknown"),
            "node_label": node.get("data", {}).get("label", node["id"]),
            "result":    node_result
        })

        if node_result["status"] == "failed":
            overall_status = "failed"
            break  # stop execution on failure

    return {
        "status": overall_status,
        "steps":  results
    }