import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";

import { policyAgent } from "../agents/policyAgent.js";
import { workloadAgent } from "../agents/workloadAgent.js";
import { burnoutAgent } from "../agents/burnoutAgent.js";
import { recommendationAgent } from "../agents/recommendationAgent.js";
import { emailAgent } from "../agents/emailAgent.js";
import { auditAgent } from "../agents/auditAgent.js";

const workflow = new StateGraph(GraphState);

workflow.addNode("policyAgent", policyAgent);
workflow.addNode("workloadAgent", workloadAgent);
workflow.addNode("burnoutAgent", burnoutAgent);
workflow.addNode("recommendationAgent", recommendationAgent);
workflow.addNode("emailAgent", emailAgent);
workflow.addNode("auditAgent", auditAgent);

workflow.addEdge(START, "policyAgent");

workflow.addEdge("policyAgent", "workloadAgent");
workflow.addEdge("workloadAgent", "burnoutAgent");
workflow.addEdge("burnoutAgent", "recommendationAgent");
workflow.addEdge("recommendationAgent", "emailAgent");
workflow.addEdge("emailAgent", "auditAgent");
workflow.addEdge("auditAgent", END);

export const graph = workflow.compile();