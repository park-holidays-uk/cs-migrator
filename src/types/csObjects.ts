type EntryObj = {
  title: string;
  parent_uid?: string;
  tags?: string[];
  locale?: string;
  ACL?: any;
  uid?: string;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
  _version?: number;
  _in_progress?: boolean;
};

type EntryPayload = {
  entry: EntryObj | null;
};

type ContentTypeSchemaEntry = {
  content_type: {
    created_at: string;
    updated_at: string;
    title: string;
    uid: string;
    _version: number;
    schema: {
      data_type: string; // 'text' | 'group' | 'number' | 'reference' | 'boolean' | 'file';
      display_name: string;
      extension_uid?: string;
      reference_to?: string[];
      field_metadata: {
        description?: string;
        _default?: boolean;
        version?: number;
        ref_multiple?: boolean;
        ref_multiple_content_types?: boolean;
      };
      mandatory: boolean;
      uid: string;
      unique: boolean;
      multiple: boolean;
      non_localizable: boolean;
    }[];
    description: string;
  };
};

type CSReference = { uid: string; _content_type_uid: string };

type CsImage = {
  uid: string;
  url: string;
  filename: string;
  content_type: string;
  description: string;
  tags: string[];
};

type CreateBody = (entry: EntryObj) => Promise<EntryPayload>;

export type { CsImage, CSReference, ContentTypeSchemaEntry, CreateBody, EntryObj, EntryPayload };
