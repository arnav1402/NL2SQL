from __future__ import annotations

from sqlalchemy import inspect, text


def get_table_cards(engine, sample_rows: int = 2) -> list[dict]:
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    cards: list[dict] = []

    with engine.connect() as connection:
        for table_name in table_names:
            columns = inspector.get_columns(table_name)
            pk_columns = set(inspector.get_pk_constraint(table_name).get("constrained_columns", []))
            foreign_keys = inspector.get_foreign_keys(table_name)

            fk_map: dict[str, str] = {}
            for fk in foreign_keys:
                referred_table = fk.get("referred_table")
                referred_columns = fk.get("referred_columns", [])
                constrained_columns = fk.get("constrained_columns", [])
                if referred_table and referred_columns and constrained_columns:
                    for local_col, ref_col in zip(constrained_columns, referred_columns):
                        fk_map[local_col] = f"{referred_table}.{ref_col}"

            card_lines = [f"Table: {table_name}", "Columns:"]
            for column in columns:
                col_name = column["name"]
                type_str = str(column.get("type"))
                markers: list[str] = []
                if col_name in pk_columns:
                    markers.append("PK")
                if col_name in fk_map:
                    markers.append(f"FK -> {fk_map[col_name]}")
                marker_text = f" ({', '.join(markers)})" if markers else ""
                card_lines.append(f"  - {col_name}: {type_str}{marker_text}")

            sample_lines = ["Sample rows:"]
            try:
                result = connection.execute(text(f"SELECT * FROM {table_name} LIMIT :limit"), {"limit": sample_rows})
                rows = result.fetchall()
                if rows:
                    for row in rows:
                        sample_lines.append(f"  - {tuple(row)}")
                else:
                    sample_lines.append("  - <no rows found>")
            except Exception as exc:  # pragma: no cover - fallback for unsupported dialects
                sample_lines.append(f"  - <sample rows unavailable: {exc}>")

            card_lines.extend(sample_lines)
            cards.append({"table": table_name, "text": "\n".join(card_lines)})

    return cards
