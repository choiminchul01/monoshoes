-- wolkey@essentia.com 계정을 master 역할로 변경
UPDATE admin_roles
SET 
    role = 'master',
    permissions = '{
        "dashboard": true,
        "customers": true,
        "orders": true,
        "products": true,
        "reviews": true,
        "board": true,
        "coupons": true,
        "inquiries": true,
        "settings": true
    }'::jsonb,
    updated_at = NOW()
WHERE email = 'wolkey@essentia.com';

-- 변경 결과 확인
SELECT 
    email,
    role,
    permissions,
    user_id,
    updated_at
FROM admin_roles
WHERE email = 'wolkey@essentia.com';
