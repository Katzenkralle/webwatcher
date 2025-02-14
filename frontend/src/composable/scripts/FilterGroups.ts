import { ref, computed, readonly, type Ref } from "vue";
import { type TableLayout } from "../api/JobAPI";

interface BooleanCondition {
    type: "Boolean";
    col: string
    testFor: boolean;
}

type NumberConditionTest = {
    mode: "col" | "const";
    value: number | string;
}

interface NumberCondition {
    type: "Number";
    testFor1: NumberConditionTest;
    testFor2: NumberConditionTest;
    opperation: "==" | "!=" | "<" | "<=" | ">" | ">=";
}

interface StringCondition {
    type: "String";
    col: string;
    testFor: String;
    mode: "includes" | "exact_match" | "regex";
}

interface AbstractCondition {
    condition: StringCondition | NumberCondition | BooleanCondition;
    negated: boolean;
    parent?: Group | null;
}

export interface Group {
    connector: "AND" | "OR" | "XOR";
    evaluatable: (Group|AbstractCondition)[];
    parent?: Group | null;
}


export const useFilterGroups = (masterGroup: Ref<Group>|undefined = undefined) => {
    if (!(masterGroup)){
        masterGroup = ref({
            connector: "AND",
            evaluatable: []
        } as Group)
    }

    const evaluateNumber = (condition: NumberCondition): Boolean => {

        return false;
    }
    const evaluateString = (condition: StringCondition): Boolean => {

        return false;
    }
    const evaluateBoolean = (condition: BooleanCondition): Boolean => {

        return false
    }

    const groupEvaluator = (group: Group): Boolean => {
        let result = false;
        let evaluatedChildren = group.evaluatable.map((groupOrCondition) => {
            if ('evaluatable' in groupOrCondition) {
                return groupEvaluator(groupOrCondition);
            } else {

                switch (groupOrCondition.condition.type) {
                    case "Boolean": return evaluateBoolean(groupOrCondition.condition);
                    case "Number": return evaluateNumber(groupOrCondition.condition);
                    case "String": return evaluateString(groupOrCondition.condition);
                }
            }
        });
        switch (group.connector) {
            case "AND": result = evaluatedChildren.every((child) => child); break;
            case "OR": result = evaluatedChildren.some((child) => child); break;
            case "XOR": result = evaluatedChildren.filter((child) => child).length === 1; break;
            default: result = false;
        }
        return result;
    }

    const applyFilterTo = (jobData: any[], columns: TableLayout[] ): any[] => {
        return jobData
    }

    const addToFilterGroup = (evaluatable: Group|AbstractCondition, parent: Group|null = null) => {      
        // Re-add parents if not present
        const addParents = (evaluatable: Group|AbstractCondition, parent: Group) => {
            evaluatable.parent = parent;
            if ('evaluatable' in evaluatable) {
                for (let child of evaluatable.evaluatable) {
                    addParents(child, evaluatable as Group);
                }
            }
        }
        addParents(evaluatable, parent ? parent : masterGroup.value);

        if (parent) {
            parent.evaluatable.push(evaluatable);
        } else {
            masterGroup.value.evaluatable.push(evaluatable);
        }
    }

    const removeFromFilterGroup = (evaluatable: Group|AbstractCondition) => {
        const parent = evaluatable.parent || null;
        if (parent) {
            parent.evaluatable = parent.evaluatable.filter((item) => item !== evaluatable);
        } else {
            masterGroup.value.evaluatable = masterGroup.value.evaluatable.filter((item) => item !== evaluatable);
        }
    }

    const changeParent = (evaluatable: Group|AbstractCondition, newParent: Group | null = null) => {
        // This function also works if the evaluatable is not present in the tree
        // can be use to add, without reevaluating the parent
        newParent = newParent ? newParent : masterGroup.value;
        if (evaluatable.parent) {
            removeFromFilterGroup(evaluatable);
        }
        evaluatable.parent = newParent;
        newParent.evaluatable.push(evaluatable);
    }

    const safeJsonStringify = () => {
        return JSON.stringify(masterGroup.value, (key, value) => {
            if (key === "parent") {
                return "[parent_circle]";
            }
            return value;
        }, 2);
    }
    
    const resetMaster = () => {
        masterGroup.value.evaluatable = [];
    }

    return {
        filterGroup: readonly(masterGroup.value),
        addToFilterGroup,
        removeFromFilterGroup,
        safeJsonStringify,
        changeParent,
        applyFilterTo,
        resetMaster
    };
};

// Test:

export const test = () => {
    let subGroup: Group = {
        connector: "OR",
        evaluatable: [
            {condition: {
                testFor: true,
                } as BooleanCondition,
                negated: false
            }
        ]
    };
    let seccond_subGroup: Group = {
        connector: "XOR",
        evaluatable: [
            
        ]
    }
    let rootGroup = ref({
        connector: "AND",
        evaluatable: []
    } as Group);
    useFilterGroups(rootGroup).addToFilterGroup({
        connector: "AND",
        evaluatable: [
            {condition: {
                    type: "String",
                    testFor: "test",
                    col: "some",
                    mode: "exact_match",
                } as StringCondition,
                negated: false
            } as AbstractCondition,
            subGroup,
            seccond_subGroup
        ]
    });
    let numberCondition: AbstractCondition = {
        condition: {
            type: "Number",
            testFor1: { mode: "col", value: "some" },
            testFor2: { mode: "const", value: 0 },
            opperation: "<",
        } as NumberCondition,
        negated: false
    }
    useFilterGroups(rootGroup).addToFilterGroup(
        numberCondition,
        subGroup
    )

    console.log("Move number condition to root");
    //
    useFilterGroups(rootGroup).changeParent(subGroup, seccond_subGroup)
    console.log(useFilterGroups(rootGroup).filterGroup);

}