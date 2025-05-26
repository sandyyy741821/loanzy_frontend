export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const idx = url.searchParams.get('idx');
    const val = url.searchParams.get('val');
    const collegeName = (url.searchParams.get('collegeName') || '').trim();
    const typeFilter = (url.searchParams.get('type') || '').trim();

    if (!idx || !val) {
      return new Response(JSON.stringify({ error: 'Missing idx or val parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const ES_HOST = env.ES_HOST;
    const ES_USERNAME = env.ES_USERNAME;
    const ES_PASSWORD = env.ES_PASSWORD;

    const mustClauses = [
      { term: { [`CREDLEV_${idx}`]: parseInt(val) } }
    ];
    if (collegeName) {
      mustClauses.push({ match: { Name: { query: collegeName, fuzziness: 'AUTO' } } });
    }
    if (typeFilter) {
      mustClauses.push({ term: { Type: typeFilter } });
    }

    const esQuery = {
      _source: ['Name', `CREDLEV_${idx}`, 'Type'],
      query: { bool: { must: mustClauses } },
      size: 10
    };

    const esResponse = await fetch(`${ES_HOST}/index_search_v4/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${ES_USERNAME}:${ES_PASSWORD}`)
      },
      body: JSON.stringify(esQuery)
    });

    if (!esResponse.ok) {
      const errorText = await esResponse.text();
      return new Response(JSON.stringify({ error: 'Elasticsearch error', details: errorText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const data = await esResponse.json();
    const hits = data.hits?.hits?.map(hit => ({
      id: hit._id,
      score: hit._score,
      source: hit._source
    })) || [];

    return new Response(JSON.stringify(hits), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
