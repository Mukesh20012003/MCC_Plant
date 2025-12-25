# plant/db_routers.py
class RagRouter:
    """
    Route all ragapp models to the 'pg_rag' database.
    """

    app_label = "ragapp"

    def db_for_read(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return "pg_rag"
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == self.app_label:
            return "pg_rag"
        return None

    def allow_relation(self, obj1, obj2, **hints):
        if (
            obj1._meta.app_label == self.app_label
            or obj2._meta.app_label == self.app_label
        ):
            return True
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        # Only create ragapp tables in pg_rag
        if app_label == self.app_label:
            return db == "pg_rag"
        # Never create non-rag models in pg_rag
        if db == "pg_rag":
            return False
        return None
