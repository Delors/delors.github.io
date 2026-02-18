export const LD_GROUP_ASSIGNMENT_TRANSLATIONS = {
    en: {
        heading: "Group Assignment",
        numberOfStudents: "Number of students:",
        desiredGroupSize: "Desired group size:",
        compute: "Compute",
        changeValues: "Change values",
        distributionResult: "Distribution Result",
        students: "Students",
        requestedGroupSize: "Requested group size",
        totalGroups: "Total groups",
        groupsWithMembers: (size) => `Groups with ${size} members`,
        assignmentsHeading: "Random group assignments",
        groupLabel: "Group",
        copyToClipboard: "→ Clipboard",
    },
    de: {
        heading: "Gruppeneinteilung",
        numberOfStudents: "Anzahl der Studierenden:",
        desiredGroupSize: "Gewünschte Gruppengröße:",
        compute: "Berechnen",
        changeValues: "Werte ändern",
        distributionResult: "Ergebnis der Verteilung",
        students: "Studierende",
        requestedGroupSize: "Gewünschte Gruppengröße",
        totalGroups: "Anzahl der Gruppen",
        groupsWithMembers: (size) => `Gruppen mit ${size} Mitgliedern`,
        assignmentsHeading: "Zufällige Gruppeneinteilung",
        groupLabel: "Gruppe",
        copyToClipboard: "→ Zwischenablage",
    },
};

export const getDocumentLanguage = () => {
    const lang =
        document?.documentElement?.lang?.toLowerCase().split("-")[0] || "en";
    return lang;
};
