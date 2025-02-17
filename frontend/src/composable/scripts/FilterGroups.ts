import { ref, computed, readonly, type Ref } from "vue";
import { type TableLayout } from "../api/JobAPI";

export interface BooleanCondition {
    type: "boolean";
    col: string
    testFor: boolean;
}

export type NumberConditionTest = {
    mode: "col" | "const";
    value: number | string;
}

export interface NumberCondition {
    type: "number";
    testFor1: NumberConditionTest;
    testFor2: NumberConditionTest;
    opperation: "==" | "!=" | "<" | "<=" | ">" | ">=";
}

export interface StringCondition {
    type: "string";
    col: string;
    testFor: string;
    mode: "includes" | "exact_match" | "regex";
}

export interface AbstractCondition {
    condition: StringCondition | NumberCondition | BooleanCondition;
    negated: boolean;
    type: "condition";
    parent?: Group | null;
}

export interface Group {
    connector: "AND" | "OR" | "XOR";
    evaluatable: (Group|AbstractCondition)[];
    type: "group";
    parent?: Group | null;
}


export const useFilterGroups = (masterGroup: Ref<Group>|undefined = undefined) => {
    if (!(masterGroup)){
        masterGroup = ref({
            connector: "AND",
            evaluatable: [],
            type: "group",
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
            if (groupOrCondition.type === "group") {
                return groupEvaluator(groupOrCondition);
            } else {
                switch (groupOrCondition.condition.type) {
                    case "boolean": return evaluateBoolean(groupOrCondition.condition);
                    case "number": return evaluateNumber(groupOrCondition.condition);
                    case "string": return evaluateString(groupOrCondition.condition);
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
        filterGroup: masterGroup,
        addToFilterGroup,
        removeFromFilterGroup,
        safeJsonStringify,
        changeParent,
        applyFilterTo,
        resetMaster
    };
};


export const availableColumns = (tableLayout: TableLayout[] | undefined, type: string) => {
    return tableLayout ? tableLayout.filter(col => col.type === type).map(col => col.key) : [];
  };
// Test:

export const test = () => {
    

}