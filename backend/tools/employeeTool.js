export async function employeeTool(employeeId) {

    return {

        id: employeeId,

        name: "Rahul Sharma",

        department: "Engineering",

        designation: "Software Engineer",

        manager: "Anita Singh",

        leaveBalance: {

            medical: 5,

            casual: 8,

            earned: 15

        },

        performance: "Excellent",

        experience: "2 Years"

    };

}