<div id="top" class="off-canvas-wrapper docs-wrap">
  <div class="off-canvas-wrapper-inner" data-off-canvas-wrapper>
    <div class="off-canvas position-left" id="offCanvas" data-off-canvas>
      <?php include ($directory."/partials/off-canvas-menu.php"); ?>
    </div>
    <div class="off-canvas-content" data-off-canvas-content>
      <main id="main-wrapper">
        <?php include ($directory."/partials/header.php"); ?>
      <?php if(!drupal_is_front_page()):?>
        <?php include ($directory."/partials/masthead.php"); ?>
        <?php if ($page['search']): ?>
        <section id="search-box">
          <?php print render($page['search']); ?>
        </section>
        <?php endif; ?>
        <section class="split-boxes" data-equalizer data-equalizer-mq="medium-up">
          <div class="columns medium-6 collapse split-box-left regular-page" data-equalizer-watch itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
            <div class="row-split" itemprop="text">
              <?php if ($tabs): ?>
              <div class="tabs-wrapper">
                <?php print render($tabs); ?>
              </div>
              <?php endif; ?>
              <?php if ($page['content']): ?>
              <?php print render($page['content']); ?>
              <?php endif; ?>
              <?php print $messages; ?>
              <?php if ($page['split-box-left']): ?>
              <?php print render($page['split-box-left']); ?>
              <?php endif; ?>
            </div>
          </div>
          <div class="column medium-6 collapse split-box-right google-maps-container" data-equalizer-watch>
          <?php if ($page['split-box-right']): ?>
            <?php print render($page['split-box-right']); ?>
          <?php endif; ?>
          </div>
        </section>
      <?php endif;?>
      </main>
      <?php include ($directory."/partials/footer.php"); ?>
    </div>
  </div>
</div>