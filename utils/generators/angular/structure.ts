import { VirtualFile, BackendConfig, Table, CustomPage } from '../../../types/index';
import { generateNavigationComponents } from './structure/navigation';
import { generateLayoutComponents } from './structure/layout';
import { generateUserPickerComponents } from './structure/userPicker';
import { generateAuthComponents } from './structure/auth';

export const generateAngularStructure = (
    config: BackendConfig,
    tables: Table[],
    root: string,
    pages: CustomPage[] = []
): VirtualFile[] => {
    const appRoot = `${root}/src/app`;
    return [
        ...generateNavigationComponents(config, tables, appRoot, pages),
        ...generateLayoutComponents(config, appRoot),
        ...generateUserPickerComponents(config, appRoot),
        ...generateAuthComponents(config, appRoot)
    ];
};
