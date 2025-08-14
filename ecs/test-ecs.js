// ECS功能测试脚本
// 在浏览器控制台中运行此脚本来测试ECS功能

console.log('=== ECS功能测试开始 ===');

// 测试ECS基本功能
function testECSBasicFunctionality() {
    console.log('1. 测试ECS基本功能...');
    
    // 这里可以添加基本的ECS功能测试
    // 由于ECS是在游戏运行时初始化的，我们需要在游戏运行后测试
    
    console.log('✓ ECS基本功能测试完成');
}

// 测试实体创建
function testEntityCreation() {
    console.log('2. 测试实体创建...');
    
    // 检查ECS适配器是否存在
    if (window.game && window.game.scene && window.game.scene.scenes.MainScene) {
        const mainScene = window.game.scene.scenes.MainScene;
        if (mainScene.ecsAdapter) {
            console.log('✓ ECS适配器存在');
            
            // 测试ECS功能
            mainScene.ecsAdapter.testECSFunctionality();
            
            // 显示ECS状态
            mainScene.ecsAdapter.debugState();
            
            return true;
        } else {
            console.log('✗ ECS适配器不存在');
            return false;
        }
    } else {
        console.log('✗ 游戏场景不存在');
        return false;
    }
}

// 测试实体转换
function testEntityConversion() {
    console.log('3. 测试实体转换...');
    
    if (window.game && window.game.scene && window.game.scene.scenes.MainScene) {
        const mainScene = window.game.scene.scenes.MainScene;
        
        // 检查是否有玩家
        if (mainScene.player) {
            console.log('✓ 玩家存在，ID:', mainScene.player.name || 'unnamed');
            
            // 检查玩家是否已转换为ECS实体
            const playerEntities = mainScene.ecsAdapter.getWorld().getEntitiesWithComponent('PlayerComponent');
            if (playerEntities.length > 0) {
                console.log('✓ 玩家已成功转换为ECS实体');
                return true;
            } else {
                console.log('✗ 玩家未转换为ECS实体');
                return false;
            }
        } else {
            console.log('✗ 玩家不存在');
            return false;
        }
    }
    
    return false;
}

// 测试系统更新
function testSystemUpdate() {
    console.log('4. 测试系统更新...');
    
    if (window.game && window.game.scene && window.game.scene.scenes.MainScene) {
        const mainScene = window.game.scene.scenes.MainScene;
        
        // 手动触发ECS更新
        mainScene.ecsAdapter.update(0.016);
        console.log('✓ ECS系统更新完成');
        
        // 检查实体数量
        const stats = mainScene.ecsAdapter.getECSStats();
        console.log('ECS统计:', stats);
        
        return true;
    }
    
    return false;
}

// 运行所有测试
function runAllTests() {
    console.log('开始运行ECS功能测试...\n');
    
    const results = [];
    
    results.push(testECSBasicFunctionality());
    results.push(testEntityCreation());
    results.push(testEntityConversion());
    results.push(testSystemUpdate());
    
    const passedTests = results.filter(result => result === true).length;
    const totalTests = results.length;
    
    console.log('\n=== 测试结果 ===');
    console.log(`通过: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有ECS测试通过！ECS系统正常工作。');
    } else {
        console.log('⚠️ 部分ECS测试失败，请检查ECS集成。');
    }
    
    return passedTests === totalTests;
}

// 导出测试函数到全局作用域
window.testECS = {
    testBasicFunctionality: testECSBasicFunctionality,
    testEntityCreation: testEntityCreation,
    testEntityConversion: testEntityConversion,
    testSystemUpdate: testSystemUpdate,
    runAllTests: runAllTests
};

console.log('ECS测试函数已加载到 window.testECS');
console.log('使用方法: window.testECS.runAllTests()'); 