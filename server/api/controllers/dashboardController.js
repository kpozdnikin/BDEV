import {signJwt} from './authentication';
import * as errors from '../../api/utils/errors';

export async function getDashboard(req, res) {

    try {
        const logs = await AuditLogger.getLogs(req.user);

        const history = logs.map(function (log) {

            const hist = {
                category: log.category,
                timestamp: log.timestamp,
                event: log.event,
                description: log.description,
                user: {
                    username: log.user.username,
                    user_id: log.user.user_id
                },
                reviewed_documents: {
                    title: log.reviewed_documents.title,
                    url: log.reviewed_documents.url,
                    signature: log.reviewed_documents.signature
                },
                signature: log.signature,
                usd_estimate: log.usd_estimate,
                certified_investor: log.certified_investor
            };

            return hist;
        });

        const wallet_info = {
            total_received: {
                total_received_usd: "total_received_usd",
                total_received_btc: "total_received_btc",
                total_received_eth: "total_received_eth"
            },
            estimated_total: {
                estimated_total_usd: "estimated_total_usd",
                estimated_total_dbn: "estimated_total_dbn"
            },
            total_dbn_sent: "total_dbn_sent"
        };

        return res.status(200).jsonWithResponseTime({success: true, auth_token: signJwt(req.user), history: history, wallet_info: wallet_info});
    } catch (e) {
        return res.status(500).jsonWithResponseTime({success: true, errors: [errors.createError(errors.INTERNAL_SERVER_ERROR)]});
    }
}
