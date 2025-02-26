import { ref, computed, readonly, type Ref, type ComputedRef } from "vue";
import { type flattendJobEnty } from "./JobDataHandler";

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
    connector: "AND" | "OR" | "XOR" | "NOR";
    evaluatable: (Group|AbstractCondition)[];
    type: "group";
    parent?: Group | null;
}

const numEval = {
    "==": (a: number, b: number) => a === b,
    "!=": (a: number, b: number) => a !== b,
    "<": (a: number, b: number) => a < b,
    "<=": (a: number, b: number) => a <= b,
    ">": (a: number, b: number) => a > b,
    ">=": (a: number, b: number) => a >= b,
}

const evaluateNumber = (condition: NumberCondition, entry: flattendJobEnty): boolean => {
    const getNumber = (testFor: NumberConditionTest): number => {
        if (testFor.mode === "const") {
            if (typeof testFor.value === "string") {
                throw new Error("Invalid number in const for Condition");
            }
            return Number(testFor.value);
        } else {
            if (!(Object.keys(entry).includes(String(testFor.value)))) {
                throw new Error("Invalid column in Condition");
            } else if (typeof entry[testFor.value] !== "number") {
                throw new Error("Invalid type in column for Condition");
            }
            return Number(entry[testFor.value]);
        }
    }
    return numEval[condition.opperation](getNumber(condition.testFor1), getNumber(condition.testFor2));
}
const evaluateString = (condition: StringCondition, entry: flattendJobEnty): boolean => {
    if (!(Object.keys(entry).includes(condition.col))) {
        throw new Error("Invalid column in Condition");
    }
    switch (condition.mode) {
        case "includes":
            return String(entry[condition.col]).includes(condition.testFor);
        case "exact_match":
            // == is used to compare the string with possible numbers
            return entry[condition.col] == condition.testFor;
        case "regex":
            return new RegExp(condition.testFor).test(String(entry[condition.col]));
        default: return true;
    }
}
const evaluateBoolean = (condition: BooleanCondition, entry: flattendJobEnty): boolean => {
    if (!(Object.keys(entry).includes(condition.col))) {
        throw new Error("Invalid column in Condition");
    }
    if (typeof entry[condition.col] === "boolean") {
        return entry[condition.col] === condition.testFor;
    }
    return true
}


const groupEvaluator = (group: Group, jobEntrys: flattendJobEnty[]): flattendJobEnty[] => {
    let result: flattendJobEnty[] = jobEntrys.filter((entry) => {
        let evaluatedChildren = group.evaluatable.map((groupOrCondition) => {
            if (groupOrCondition.type === "group") {
                return groupEvaluator(groupOrCondition, [entry]);
            } else {
                const shouldNegate = (val: boolean) => groupOrCondition.negated ? !val : val;
                try { 
                    switch (groupOrCondition.condition.type) {
                        // Returns bool, error or true
                        case "boolean": return shouldNegate(evaluateBoolean(groupOrCondition.condition, entry));
                        case "number": return shouldNegate(evaluateNumber(groupOrCondition.condition, entry));
                        case "string": return shouldNegate(evaluateString(groupOrCondition.condition, entry));
                    }
                } catch (e) {
                    console.debug("Accepted error during evaluation:" + e);
                    return true;
                }
            }
        });
        if (evaluatedChildren.length === 0) {
            return true;
        }
        switch (group.connector) {
            case "AND": return evaluatedChildren.every((child) => child);
            case "OR": return evaluatedChildren.some((child) => child);
            case "XOR": return evaluatedChildren.filter((child) => child).length === 1;
            case "NOR": return !evaluatedChildren.some((child) => child);
            default: return true;
        }
    });
    return result;
}

export const safeJsonStringify = (group: Group) => {
    return JSON.stringify(group, (key, value) => {
        if (key === "parent") {
            return "[parent_circle]";
        }
        return value;
    }, 2);
}


// Needet to be able to use Extract to pick weather to use Group or AbstractCondition
export type IterationContext<T extends Group | AbstractCondition = Group | AbstractCondition> = {
    thisElement: ComputedRef<T>;
    path: string;
    root: Ref<Group>;
    evaluatables: readonly string[];
    iter: () => IterationContext[];
    getStandartEvaluable: (name: "Number" | "String" | "Boolean" | "Group") => Group|AbstractCondition;
    addToFilterGroup: (evaluatable: Group|AbstractCondition, parent?: Group|null) => void;
    exchangePosition: <T extends Group | AbstractCondition>(elemA: T, elemB: T) => void;
    changeParent: (newParent: Group, evaluatable?: Group|AbstractCondition|null) => void;
    removeFromFilterGroup: (evaluatable?: Group|AbstractCondition|null, justReturnIndex?: boolean) => number;
    applyFiltersOnData: (data: flattendJobEnty[], group?: Group|null) => flattendJobEnty[];
};

export const useFilterIterationContext = (
    root: Ref<Group>|null = null,
    _thisElement: Group | AbstractCondition | null = null,
    path: string = ".0"
  ): IterationContext => {
    
    if (!root){
        root = ref({connector: "AND", evaluatable: [], type: "group"} as Group);
    }
    const evaluatables = ["Number", "String", "Boolean", "Group"] as const;
    
    const thisElement = computed(() => {
        return _thisElement ?? root.value;
    })
    //_thisElement ?? root.value;
  
    if (!thisElement.value) {
      throw new Error("Invalid element reference");
    }
  
    const iter = (): IterationContext[] => {
      if (thisElement.value.type === "condition") {
        return []; // Return an empty array instead of throwing an error
      }
  
      return (thisElement.value as Group).evaluatable.map((evaluatable, index) =>
        useFilterIterationContext(root, evaluatable, `${path}.${index}`)
      );
    };
    

    const removeFromFilterGroup = (evaluatable: Group|AbstractCondition|null = null, justReturnIndex: boolean = false): number => {
        evaluatable = evaluatable ?? thisElement.value;
        const parent = evaluatable.parent || null;
        if (!parent) {
            return -1;
        }
        let index = parent.evaluatable.findIndex((elem) => elem === evaluatable);
        if (!justReturnIndex) {
            parent.evaluatable.splice(index, 1);
        }
        return index;
    }

    const addToFilterGroup = (evaluatable: Group|AbstractCondition, parent: Group|null = null) => {
        if (thisElement.value.type !== "group") {
            throw new Error("Cannot add to a condition");
        }
        parent = parent ?? thisElement.value;

        const addParents = (evaluatable: Group|AbstractCondition, parent: Group) => {
            evaluatable.parent = parent;
            if ('evaluatable' in evaluatable) {
                for (let child of evaluatable.evaluatable) {
                    addParents(child, evaluatable as Group);
                }
            }
        }
        addParents(evaluatable, parent);
        parent.evaluatable.push(evaluatable);
    }

    const exchangePosition = <T extends Group | AbstractCondition>(elemA: T, elemB: T) => {
        if (elemA === elemB) {
            return;
        }

        if (elemA.type === "group" && elemB.type === "group") {
            const findB = (group: Group): boolean => {
                if (group === elemB) {
                    return true;
                }
                for (let child of group.evaluatable) {
                    if (child.type === "group") {
                        if (findB(child as Group)) {
                            return true;
                        }
                    }
                }
                return false;
            }
            // New master is the one that curenntly holds the other as a child
            const new_master = (findB(elemA) ? elemB : elemA) as Group;
            const old_master = (new_master === elemA ? elemB : elemA) as Group;
    
            removeFromFilterGroup(new_master);
            new_master.parent = old_master.parent;

            removeFromFilterGroup(old_master);
            old_master.parent = new_master;


            // Resort evaluatables
            // Ensures that only Conditions are moved with the old/new master
            // This turned out to be a better user experience
            let eval_new = new_master.evaluatable;
            let eval_old = old_master.evaluatable;
            new_master.evaluatable = [];
            old_master.evaluatable = [];

            const reorderChildren = (group: (Group | AbstractCondition)[], order_fn: (elem: Group|AbstractCondition) => boolean) => {
                group.forEach((elem) => {
                    if (order_fn(elem)) {
                        elem.parent = new_master;
                        new_master.evaluatable.push(elem);
                    } else {
                        elem.parent = old_master;
                        old_master.evaluatable.push(elem);
                    }
                });
            }
            reorderChildren(eval_new, (elem) => elem.type !== "group");
            reorderChildren(eval_old, (elem) => elem.type === "group");

            new_master.evaluatable.push(old_master);
            if (new_master.parent) {
                new_master.parent.evaluatable.push(new_master);
            } else {
                root.value = new_master;
            }
            return;
        } 
        const indexA = removeFromFilterGroup(elemA, true);
        const indexB = removeFromFilterGroup(elemB, true);
        
        const parentA = elemA.parent || null;
        const parentB = elemB.parent || null;

        if (!parentA || !parentB) {
            throw new Error("Invalid parent");
        }
        elemB.parent = parentA;
        parentA.evaluatable.splice(indexA, 1, elemB);
    
        elemA.parent = parentB;
        parentB.evaluatable.splice(indexB, 1, elemA);
    }

    const changeParent = (newParent: Group, evaluatable: Group|AbstractCondition|null = null) => {
        // This function also works if the evaluatable is not present in the tree
        // can be use to add, without reevaluating the parent
        evaluatable = evaluatable ?? thisElement.value;
        if (evaluatable.parent) {
            removeFromFilterGroup(evaluatable);
        }
        evaluatable.parent = newParent;
        newParent.evaluatable.push(evaluatable);
        }

    const applyFiltersOnData = (data: flattendJobEnty[], group: Group|null = null): flattendJobEnty[] => {
        group = group ?? root.value;
        // This function is not yet implemented
        return groupEvaluator(group, data);
    }

    const getStandartEvaluable = (name: typeof evaluatables[number]): Group|AbstractCondition => {
        const standardCondition = {
            "Number": {
                "type": "number",
                "testFor1": {
                    "mode": "col",
                    "value": ""
                },
                "testFor2": {
                    "mode": "col",
                    "value": ""
                },
                "opperation": "=="
            } as NumberCondition,
            "String": {
                "type": "string",
                "col": "job_id",
                "testFor": "",
                "mode": "exact_match"
            } as StringCondition,
            "Boolean": {
                "type": "boolean",
                "col": "job_id",
                "testFor": true 
            } as BooleanCondition
        }
        
        if (name !== "Group") {
            return {
                condition: standardCondition[name],
                negated: false,
                type: "condition"
            } as AbstractCondition;
        }
        return {
                "connector":
                    "AND",
                "evaluatable": [],
                "type": "group"
            } as Group;
    }

    return {
        thisElement,
        path,
        root,
        evaluatables,
        iter,
        addToFilterGroup,
        getStandartEvaluable,
        exchangePosition,
        changeParent,
        removeFromFilterGroup,
        applyFiltersOnData

    } as IterationContext;
  };