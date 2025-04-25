export interface IminimalAddress {
  _id: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  type: string;
  status: string;
}
export interface IfullAddress {
  _id: string;
  user_id: string;
  full_name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  phone_number?: string;
  is_default?: boolean;
  type: string;
  status: string;
}

export interface IiUFAddress {
  _id: string;
  user_id: string;
  full_name: string;
}

export interface IgroupedAddresses {
  [full_name: string]: IminimalAddress[];
}

export interface IgroupedAddressesByUserId {
  [user_id: string]: {
    _id: string;
    full_name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    type: string;
    status: string;
  }[];
}

// ******** Queries Interfaces ********
