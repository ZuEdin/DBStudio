
import { ProjectTemplate } from '../../types/index';
import { crmSuite } from './business/crmSuite';
import { inventoryApp } from './business/inventoryApp';
import { agilePm } from './it/agilePm';
import { deviceRental } from './education/deviceRental';

export const TEMPLATES: ProjectTemplate[] = [
    crmSuite,
    deviceRental,
    agilePm,
    inventoryApp
];
