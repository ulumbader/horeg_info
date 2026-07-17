export interface EventFilterState {
  search?: string;
  province?: string;
  city?: string;
  status?: string;
}

/**
 * Safely parses URL search parameters into a structured filter state.
 */
export function parseEventFilters(params: URLSearchParams): EventFilterState {
  const filter: EventFilterState = {};

  const search = params.get("search");
  if (search && typeof search === "string" && search.trim() !== "") {
    filter.search = search.trim();
  }

  const province = params.get("province");
  if (province && typeof province === "string" && province.trim() !== "") {
    filter.province = province.trim();
  }

  const city = params.get("city");
  if (city && typeof city === "string" && city.trim() !== "") {
    filter.city = city.trim();
  }

  const status = params.get("status");
  if (status && typeof status === "string" && ["ONGOING", "UPCOMING", "PAST"].includes(status.toUpperCase())) {
    filter.status = status.toUpperCase();
  }

  return filter;
}

/**
 * Serializes a filter state back into URL search parameters.
 */
export function serializeEventFilters(filter: EventFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filter.search) {
    params.set("search", filter.search);
  }
  if (filter.province) {
    params.set("province", filter.province);
  }
  if (filter.city) {
    params.set("city", filter.city);
  }
  if (filter.status) {
    params.set("status", filter.status);
  }

  return params;
}
