import { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { api } from '../../services/api';

export interface RecordedRequest {
  method?: string;
  url?: string;
  params?: unknown;
  data?: unknown;
  authorization?: string;
}

/**
 * Reemplaza el adaptador HTTP de la instancia real de axios (`api`) para que
 * responda con un código y un cuerpo controlados, y registra cada petición que
 * sale. Así se prueba el contrato HTTP del cliente (método, URL, parámetros,
 * cuerpo, cabeceras y manejo de códigos 2xx/4xx) sin levantar un servidor.
 * Devuelve `restore` para dejar el adaptador original.
 */
export function stubApi(status: number, body: unknown) {
  const requests: RecordedRequest[] = [];
  const original = api.defaults.adapter;

  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const headers = config.headers as unknown as { get?: (name: string) => string | undefined };
    requests.push({
      method: config.method,
      url: config.url,
      params: config.params,
      data: typeof config.data === 'string' ? JSON.parse(config.data) : config.data,
      authorization: headers.get?.('Authorization'),
    });

    const response = { data: body, status, statusText: String(status), headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_REQUEST, config, null, response);
  };

  return {
    requests,
    restore: () => {
      api.defaults.adapter = original;
    },
  };
}
