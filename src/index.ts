import { Logger, IPluginMiddleware, IBasicAuth, IStorageManager, PluginOptions } from '@verdaccio/types';
import { Router, Request, Response, NextFunction, Application } from 'express';
import { CustomConfig } from './types/index';

export default class FleetbaseExtensionsMiddleware implements IPluginMiddleware<CustomConfig> {
    public logger: Logger;
    public constructor(config: CustomConfig, options: PluginOptions<CustomConfig>) {
        this.logger = options.logger;
    }

    public register_middlewares(app: Application, auth: IBasicAuth<CustomConfig>, storage: IStorageManager<CustomConfig>): void {
        const router = Router();
        router.get('/', (req: Request, res: Response & { report_error?: Function }, next: NextFunction): void => {
            const keyword = req.query.q ? String(req.query.q).toLowerCase() : '';

            storage.getLocalDatabase((err, packages) => {
                if (err) {
                    return next(err);
                }

                let filteredPackages = packages;

                if (keyword) {
                    filteredPackages = packages.filter((pkg) => {
                        const nameMatch = pkg.name.toLowerCase().includes(keyword);
                        const descriptionMatch = pkg.description && pkg.description.toLowerCase().includes(keyword);
                        const keywordsMatch = pkg.keywords && pkg.keywords.some((kw) => kw.toLowerCase().includes(keyword));

                        return nameMatch || descriptionMatch || keywordsMatch;
                    });
                }

                res.json(filteredPackages);
            });
        });

        app.use('/-/flb/extensions', router);
    }
}
