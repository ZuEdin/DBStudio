
import { ProjectTemplate } from '../../types/index';
import { getEcommerceOrderProcessing } from './business/ecommerceOrderProcessing';
import { getProjectManagementTaskBoard } from './it/projectManagementTaskBoard';
import { getHrEmployeeDirectory } from './business/hrEmployeeDirectory';
import { getIotMachineTelemetry } from './it/iotMachineTelemetry';
import { getCourseResourceBooking } from './education/courseResourceBooking';
import { getFakturierungApp } from './business/fakturierungApp';
import { getCrmSuite } from './business/crmSuite';
import { getInventoryApp } from './business/inventoryApp';
import { getCmsTemplate } from './business/cmsTemplate';
import { getAgilePm } from './it/agilePm';
import { getDbstudioSelfHost } from './it/dbstudioSelfHost';
import { getDeviceRental } from './education/deviceRental';
import { getCoffeeFund } from './office/coffeeFund';

export const getTemplates = (lang: string): ProjectTemplate[] => [
    getEcommerceOrderProcessing(lang),
    getProjectManagementTaskBoard(lang),
    getHrEmployeeDirectory(lang),
    getIotMachineTelemetry(lang),
    getCourseResourceBooking(lang),
    getFakturierungApp(lang),
    getDbstudioSelfHost(lang),
    getCmsTemplate(lang),
    getCrmSuite(lang),
    getDeviceRental(lang),
    getAgilePm(lang),
    getInventoryApp(lang),
    getCoffeeFund(lang)
];

