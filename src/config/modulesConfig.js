import rawModulesConfig from './modulesConfig.json';
export const MODULES_CONFIG = rawModulesConfig;
export const MODULE_ORDER = [
    'students',
    'assessment-attempts',
    'assessment-scores',
    'career-profiles',
    'student-files',
    'sessions',
    'attendance',
    'student-submissions',
    'companies',
    'opportunities',
    'applications'
];
export const getModuleConfig = (id) => {
    return MODULES_CONFIG[id];
};
export const getModuleByPrimaryId = (primaryIdName) => {
    return Object.values(MODULES_CONFIG).find(m => m.primaryId === primaryIdName);
};
