export async function policyTool() {

    return {

        medicalLeave: {
            maxDays: 7,
            requiresApproval: true
        },

        casualLeave: {
            maxDays: 12,
            requiresApproval: false
        },

        earnedLeave: {
            maxDays: 20,
            requiresApproval: true
        },

        workFromHome: {
            maxDays: 30,
            requiresApproval: true
        }

    };

}