/** Minimal client for the QuickBooks Online Accounting API (query endpoint). */

export interface QboItem {
  Id: string;
  Name: string;
  Sku?: string;
  Description?: string;
  UnitPrice?: number;
  QtyOnHand?: number;
  Type?: string;
  Active?: boolean;
}

interface QueryResponse {
  QueryResponse?: { Item?: QboItem[] };
}

/**
 * Query all Items from a QuickBooks company. The caller filters by type; we pull
 * everything (up to 1000) so inventory and non-inventory items are both returned.
 */
export async function queryItems(params: {
  apiBase: string;
  realmId: string;
  accessToken: string;
}): Promise<QboItem[]> {
  const query = encodeURIComponent('select * from Item maxresults 1000');
  const url = `${params.apiBase}/v3/company/${params.realmId}/query?minorversion=65&query=${query}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`QuickBooks item query failed (${res.status}): ${detail}`);
  }

  const json = (await res.json()) as QueryResponse;
  return json.QueryResponse?.Item ?? [];
}
