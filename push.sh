git add .
git commit -m "Tính toán biên giá diff, định dạng số formatNumber, định giá khoảng thời gian formatDuration"
git push

# merge -> main 
git checkout main
git merge master 
git push origin main 

git checkout master

# deploy
# wrangler pages deploy example --project-name=lwc-plugin-price-ranges --branch=production
