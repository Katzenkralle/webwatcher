import { ref, computed } from 'vue';
import regression from 'regression';
import { useJobDataHandler } from './JobDataHandler';
import { parse } from 'mathjs';

export const useRegressionHandler = (dataHandler: ReturnType<typeof useJobDataHandler>) => {
    const xColumn = ref<string>('');
    const yColumn = ref<string>('');
    const regressionTypes = ['linear', 'exponential', 'logarithmic', 'power', 'polynomial'];
    const selectedRegression = ref<string>('linear');
    
    const computedRegressionResults = computed((): string => {
        if (!xColumn.value || !yColumn.value) {
            return "";
        }
        const innputData = dataHandler.computeDisplayedData.value.map((row: any) => [row[xColumn.value], row[yColumn.value]]);

        let regressor
        switch (selectedRegression.value) {
            case 'linear':
                regressor = regression.linear(innputData)  
                break;
            case 'exponential':
                regressor = regression.exponential(innputData);
                break;
            case 'logarithmic':
                regressor = regression.logarithmic(innputData);
                break;
            case 'power':
                regressor = regression.power(innputData);
                break;
            case 'polynomial':
                regressor = regression.polynomial(innputData);
        }
        try {
            return parse(regressor.string).toTex();
        } catch (error) {
            return regressor.string;
        }
    });
    return {
        xColumn,
        yColumn,
        regressionTypes,
        selectedRegression,
        computedRegressionResults,
    }
}