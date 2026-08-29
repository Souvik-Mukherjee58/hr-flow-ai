import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({

    leaveRequest: Annotation(),

    policy: Annotation(),

    workload: Annotation(),

    burnout: Annotation(),

    recommendation: Annotation(),

    email: Annotation(),

    audit: Annotation()

});