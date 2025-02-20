import { ref, computed, readonly, type Ref, type ComputedRef } from "vue";
import { type jobEnty, type TableLayout } from "../api/JobAPI";

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



const evaluateNumber = (condition: NumberCondition): boolean => {

    return false;
}
const evaluateString = (condition: StringCondition): boolean => {

    return false;
}
const evaluateBoolean = (condition: BooleanCondition): boolean => {

    return false
}

const groupEvaluator = (group: Group): boolean => {
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
    iter: () => IterationContext[];
    addToFilterGroup: (evaluatable: Group|AbstractCondition, parent?: Group|null) => void;
    exchangePosition: <T extends Group | AbstractCondition>(elemA: T, elemB: T) => void;
    changeParent: (newParent: Group, evaluatable?: Group|AbstractCondition|null) => void;
    removeFromFilterGroup: (evaluatable?: Group|AbstractCondition|null, justReturnIndex?: boolean) => number;
    applyFiltersOnData: (data: jobEnty[], group?: Group|null) => jobEnty[];
};

export const useFilterIterationContext = (
    root: Ref<Group>|null = null,
    _thisElement: Group | AbstractCondition | null = null,
    path: string = ".0"
  ): IterationContext => {
    
    if (!root){
        root = ref({connector: "AND", evaluatable: [], type: "group"} as Group);
    }
    
    
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
        const indexA = removeFromFilterGroup(elemA, true);
        const indexB = removeFromFilterGroup(elemB, true);
        
        const parentA = elemA.parent || null;
        const parentB = elemB.parent || null;
        if (!parentA !== !parentB) {
            // For moving groups (to the top level)
            if (elemA.type === "condition" || elemB.type === "condition") {
                throw new Error("A condition should have a perent group");
            }
            const new_master = (parentA ? elemA : elemB) as Group;
            const old_master = (!parentA ? elemA : elemB) as Group;
    
            removeFromFilterGroup(new_master);
            new_master.parent = null;
            old_master.parent = new_master;
            new_master.evaluatable.push(old_master);
            root.value = new_master;
    
            return;
        } else if (parentA == null || parentB == null) {
            // Both elements are not in the tree
            throw new Error("Both elements are not in the tree");
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

    const applyFiltersOnData = (data: jobEnty[], group: Group|null = null): jobEnty[] => {
        group = group ?? root.value;
        // This function is not yet implemented
        groupEvaluator(group);
        return data;
    }

    return {
        thisElement,
        path,
        root,
        iter,
        addToFilterGroup,
        exchangePosition,
        changeParent,
        removeFromFilterGroup,
        applyFiltersOnData

    } as IterationContext;
  };