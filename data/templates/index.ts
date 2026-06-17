
import { ProjectTemplate } from '../../types/index';
import { getCrmSuite } from './business/crmSuite';
import { getInventoryApp } from './business/inventoryApp';
import { getAgilePm } from './it/agilePm';
import { getDeviceRental } from './education/deviceRental';
import { getCoffeeFund } from './office/coffeeFund';

export const getTemplates = (lang: string): ProjectTemplate[] => [
    getCrmSuite(lang),
    getDeviceRental(lang),
    getAgilePm(lang),
    getInventoryApp(lang),
    getCoffeeFund(lang)
];
