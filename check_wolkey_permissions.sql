-- wolkey@essentia.com 계정의 관리자 권한 확인
SELECT 
    email,
    role,
    permissions,
    user_id,
    created_at
FROM admin_roles
WHERE email = 'wolkey@essentia.com';
