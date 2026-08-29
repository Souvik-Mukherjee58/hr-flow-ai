import { policyTool } from "./tools/policyTool.js";
import { employeeTool } from "./tools/employeeTool.js";
import { leaveTool } from "./tools/leaveTool.js";
import { analyticsTool } from "./tools/analyticsTool.js";

console.log(await policyTool());

console.log(await employeeTool("EMP001"));

console.log(await leaveTool());

console.log(await analyticsTool("EMP001"));