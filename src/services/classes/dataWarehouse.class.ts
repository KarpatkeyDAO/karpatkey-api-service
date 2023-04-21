import { BigQuery } from '@google-cloud/bigquery'
import config from '../../config'

export class DataWarehouse {
  private static instance: DataWarehouse
  private bigQuery: BigQuery

  private constructor() {
    this.bigQuery = new BigQuery({
      projectId: config.googleProjectId,
      credentials: config.googleCredentials
    })
  }

  public static getInstance(): DataWarehouse {
    if (!DataWarehouse.instance) {
      DataWarehouse.instance = new DataWarehouse()
    }

    return DataWarehouse.instance
  }

  async getTotalAmountManaged() {
    const dataset = this.bigQuery.dataset('reports')
    const [view] = await dataset.table('vw_total_amount_managed').get()
    const viewQuery = view.metadata.view.query

    return this.executeCommonJobQuery(viewQuery)
  }

  async executeCommonJobQuery(viewQuery: string) {
    const options = {
      query: viewQuery,
      // Location must match that of the dataset(s) referenced in the query.
      location: 'US'
    }

    // Run the query as a job
    const [job] = await this.bigQuery.createQueryJob(options)
    console.log(`Job ${job.id} started.`)

    // Wait for the query to finish
    const [rows] = await job.getQueryResults()

    // We need to do this because the rows object is not serializable (there are some weird objects returned by the BigQuery API)
    return JSON.parse(JSON.stringify(rows))
  }
}