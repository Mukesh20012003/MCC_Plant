from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsQCOrReadOnly(BasePermission):
    """
    Read for any authenticated user.
    Write only for users with role QC_ANALYST or ADMIN.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        if not request.user.is_authenticated:
            return False

        profile = getattr(request.user, "profile", None)
        if not profile:
            return False

        return profile.role in ("QC_ANALYST", "ADMIN")
