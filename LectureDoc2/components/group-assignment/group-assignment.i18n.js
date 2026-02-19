export const LD_GROUP_ASSIGNMENT_TRANSLATIONS = {
    en: {
        heading: "Group Assignment",
        numberOfStudents: "Number of students",
        desiredGroupSize: "Desired group size",
        compute: "Compute",
        changeValues: "Change values",
        distributionResult: "Distribution Result",
        requestedGroupSize: "Requested group size",
        totalGroups: "Total groups",
        assignmentsHeading: "Random group assignments",
        preferSmallerGroups: "Prefer smaller groups",
        groupLabel: "Group",
        copyToClipboard: "→ Clipboard",
        yes: "Yes",
        no: "No",
    },
    de: {
        heading: "Gruppeneinteilung",
        numberOfStudents: "Anzahl der Studierenden",
        desiredGroupSize: "Gewünschte Gruppengröße",
        compute: "Berechnen",
        changeValues: "Werte ändern",
        distributionResult: "Ergebnis der Verteilung",
        requestedGroupSize: "Gewünschte Gruppengröße",
        totalGroups: "Anzahl der Gruppen",
        assignmentsHeading: "Zufällige Gruppeneinteilung",
        preferSmallerGroups: "Kleinere Gruppen bevorzugen",
        groupLabel: "Gruppe",
        copyToClipboard: "→ Zwischenablage",
        yes: "Ja",
        no: "Nein",
    },
};

export const getDocumentLanguage = () => {
    const lang =
        document?.documentElement?.lang?.toLowerCase().split("-")[0] || "en";
    return lang;
};
