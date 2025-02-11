import { textSpanContainsPosition } from "typescript";
import { ref, computed, readonly, type Ref } from "vue";


interface BooleanCondition {
    type: "Boolean";
    value: boolean;
}

interface NumberCondition {
    type: "Number";
    value_1: number;
    value_2: number;
    mode: "==" | "!=" | "<" | "<=" | ">" | ">=";
}

interface StringCondition {
    type: "String";
    value: string;
    mode: string;
}

interface AbstractCondition {
    condition: StringCondition | NumberCondition | BooleanCondition;
    negated: boolean;
    parent?: Group | null;
}

interface Group {
    connector: "AND" | "OR" | "XOR";
    evaluatable: (Group|AbstractCondition)[];
    parent?: Group | null;
}


const masterGroup: Ref<Group> = ref({
    connector: "AND",
    evaluatable: []
});

export const useFilterGroups = () => {
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
    
    return {
        filterGroup: readonly(masterGroup.value),
        addToFilterGroup,
        removeFromFilterGroup,
        safeJsonStringify,
        changeParent
    };
};

// Test:

export const test = () => {
    let subGroup: Group = {
        connector: "OR",
        evaluatable: [
            {condition: {
                value: true,
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
    useFilterGroups().addToFilterGroup({
        connector: "AND",
        evaluatable: [
            {condition: {
                    value: "test",
                    mode: "=="
                } as StringCondition,
                negated: false
            } as AbstractCondition,
            subGroup,
            seccond_subGroup
        ]
    });
    let numberCondition: AbstractCondition = {
        condition: {
            value_1: 1,
            value_2: 2,
            mode: "<",
        } as NumberCondition,
        negated: false
    }
    useFilterGroups().addToFilterGroup(
        numberCondition,
        subGroup
    )

    console.log("Move number condition to root");
    //
    useFilterGroups().changeParent(subGroup, seccond_subGroup)
    console.log(useFilterGroups().filterGroup);

}